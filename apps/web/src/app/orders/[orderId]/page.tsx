import { OrderDetail } from "@/components/order-detail";

type OrderPageProps = {
  params: Promise<{
    orderId: string;
  }>;
};

export default async function OrderPage({ params }: OrderPageProps) {
  const { orderId } = await params;
  return <OrderDetail orderId={orderId} />;
}
