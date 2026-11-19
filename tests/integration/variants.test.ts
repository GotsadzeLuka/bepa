import { test, after } from 'node:test'
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { prisma } from '../../src/lib/db'
import { reconcileProductVariants } from '../../src/lib/variant-reconciliation'
import { transitionOrder } from '../../src/lib/order-fulfillment'

if (!process.env.DATABASE_URL) throw new Error('Real disposable PostgreSQL is required')

const products:string[]=[]
const orders:string[]=[]
async function product(){
 const p=await prisma.product.create({data:{
  slug:'historical-'+randomUUID(),nameEn:'Test',nameKa:'ტესტი',price:'12.00',stock:0,
 }})
 products.push(p.id)
 return p
}
after(async()=>{
 await prisma.order.deleteMany({where:{id:{in:orders}}})
 await prisma.product.deleteMany({where:{id:{in:products}}})
 await prisma.$disconnect()
})

test('removing an ordered variant deactivates it without losing restock identity',async()=>{
 const p=await product()
 const v=await prisma.productVariant.create({data:{
  productId:p.id,nameEn:'Standard',nameKa:'სტანდარტი',sku:'STD',price:'12.00',stock:0,
 }})
 const o=await prisma.order.create({data:{status:'confirmed',shippingAddress:{test:true},total:'12.00'}})
 orders.push(o.id)
 await prisma.orderItem.create({data:{orderId:o.id,productId:p.id,variantId:v.id,price:'12.00',quantity:1}})
 await prisma.$transaction(tx=>reconcileProductVariants(tx,p.id,[]))
 const remains=await prisma.productVariant.findUniqueOrThrow({where:{id:v.id}})
 assert.equal(remains.isActive,false)
 await prisma.$transaction(tx=>transitionOrder(tx,o.id,'cancelled'))
 assert.equal((await prisma.productVariant.findUniqueOrThrow({where:{id:v.id}})).stock,1)
})

test('editing variants preserves stable IDs and deletes unreferenced records',async()=>{
 const p=await product()
 const v=await prisma.productVariant.create({data:{
  productId:p.id,nameEn:'Standard',nameKa:'სტანდარტი',sku:'STD',price:'12.00',stock:3,
 }})
 await prisma.$transaction(tx=>reconcileProductVariants(tx,p.id,[{
  nameEn:'Renamed',nameKa:'ახალი',sku:'STD',price:13,stock:4,isActive:true,
 }]))
 const unchanged=await prisma.productVariant.findUniqueOrThrow({where:{id:v.id}})
 assert.equal(unchanged.nameEn,'Renamed')
 assert.equal(unchanged.stock,4)
 await prisma.$transaction(tx=>reconcileProductVariants(tx,p.id,[]))
 assert.equal(await prisma.productVariant.findUnique({where:{id:v.id}}),null)
})

test('duplicate variants fail atomically',async()=>{
 const p=await product()
 await assert.rejects(prisma.$transaction(tx=>reconcileProductVariants(tx,p.id,[
  {nameEn:'A',nameKa:'A',sku:'SAME',price:12,stock:1,isActive:true},
  {nameEn:'B',nameKa:'B',sku:'SAME',price:12,stock:1,isActive:true},
 ])),/Duplicate/)
 assert.equal(await prisma.productVariant.count({where:{productId:p.id}}),0)
})
