import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { test, before, after } from 'node:test'
import { Client, type QueryResult } from 'pg'

const url=process.env.DIRECT_URL ?? process.env.DATABASE_URL
if (!url || process.env.NODE_ENV !== 'test' ||
    !['localhost','127.0.0.1'].includes(new URL(url).hostname)) {
  throw new Error('Requires isolated localhost PostgreSQL and NODE_ENV=test')
}
const admin = new Client({connectionString:url})
const ownerId=randomUUID(),otherId=randomUUID(),adminId=randomUUID(),productId=randomUUID()
const orderId=randomUUID(),reviewId=randomUUID()

async function asRole<T=unknown>(
  role:'anon'|'authenticated',
  subject:string|null,
  sql:string,
  params:unknown[]=[],
):Promise<QueryResult<T>> {
  const client=new Client({connectionString:url})
  await client.connect()
  try{
    await client.query('BEGIN')
    // role identifier is a fixed internal literal, never user-input SQL
    await client.query(role==='anon'?'SET LOCAL ROLE anon':'SET LOCAL ROLE authenticated')
    await client.query('SELECT set_config($1,$2,true)', ['request.jwt.claim.sub', subject ?? ''])
    return await client.query<T>(sql,params)
  }finally {
    await client.query('ROLLBACK').catch(()=>{})
    await client.end()
  }
}

before(async()=>{
 await admin.connect()
 for(const id of [ownerId,otherId,adminId]){
   await admin.query('INSERT INTO auth.users(id,email) VALUES($1,$2)',[id,'rls-'+id+'@example.invalid'])
 }
 await admin.query('UPDATE profiles SET role=$1 WHERE id=$2',['admin',adminId])
 await admin.query(`INSERT INTO products(id,name_en,name_ka,slug,price,stock)
                   VALUES($1,'Synthetic','სატესტო',$2,10,3)`,[productId,'rls-'+productId])
 await admin.query(`INSERT INTO orders(id,user_id,total,shipping_address)
                   VALUES($1,$2,10,'{"test":true}'::jsonb)`,[orderId,ownerId])
 await admin.query(`INSERT INTO reviews(id,user_id,product_id,rating,is_approved)
                   VALUES($1,$2,$3,5,false)`,[reviewId,ownerId,productId])
})
after(async()=>{
 try{
   await admin.query('DELETE FROM reviews WHERE id=$1',[reviewId])
   await admin.query('DELETE FROM orders WHERE id=$1',[orderId])
   await admin.query('DELETE FROM products WHERE id=$1',[productId])
   await admin.query('DELETE FROM auth.users WHERE id=ANY($1::uuid[])',[[ownerId,otherId,adminId]])
 }finally{await admin.end()}
})

test('authenticated client sees own orders but not unrelated private orders',async()=>{
 const own=await asRole('authenticated',ownerId,'SELECT id FROM orders WHERE id=$1',[orderId])
 assert.equal(own.rows.length,1)
 const unrelated=await asRole('authenticated',otherId,'SELECT id FROM orders WHERE id=$1',[orderId])
 assert.equal(unrelated.rows.length,0)
})
test('anonymous role is not granted private order reads',async()=>{
 await assert.rejects(asRole('anon',null,'SELECT id FROM orders'),(e:unknown)=>(e as {code?:string}).code==='42501')
})
test('browser roles cannot mutate product stock or checkout totals',async()=>{
 await assert.rejects(asRole('authenticated',ownerId,'UPDATE products SET stock=999 WHERE id=$1',[productId]),(e:unknown)=>(e as {code?:string}).code==='42501')
 await assert.rejects(asRole('anon',null,"INSERT INTO orders(id,total,shipping_address) VALUES(gen_random_uuid(),1,'{}'::jsonb)"),(e:unknown)=>(e as {code?:string}).code==='42501')
})
test('authenticated users cannot elevate their own profile role',async()=>{
 await assert.rejects(asRole('authenticated',ownerId,"UPDATE profiles SET role='admin' WHERE id=$1",[ownerId]),(e:unknown)=>(e as {code?:string}).code==='42501')
 const row=await admin.query('SELECT role FROM profiles WHERE id=$1',[ownerId])
 assert.equal(row.rows[0].role,'user')
})
test('users cannot approve their own reviews through the data API',async()=>{
 await assert.rejects(asRole('authenticated',ownerId,'UPDATE reviews SET is_approved=true WHERE id=$1',[reviewId]),(e:unknown)=>(e as {code?:string}).code==='42501')
})
test('pending review is not readable by other users, owner can inspect it',async()=>{
 const mine=await asRole('authenticated',ownerId,'SELECT id FROM reviews WHERE id=$1',[reviewId])
 const other=await asRole('authenticated',otherId,'SELECT id FROM reviews WHERE id=$1',[reviewId])
 assert.equal(mine.rows.length,1);assert.equal(other.rows.length,0)
})
