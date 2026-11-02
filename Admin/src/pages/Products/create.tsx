import { useCreate, type HttpError } from "@refinedev/core";
import { useNavigate } from "react-router";
import { ProductForm, type Product, type ProductPayload } from "./ProductForm";

export default function CreateProductPage() {
  const navigate = useNavigate();
  const { mutateAsync } = useCreate<Product, HttpError, ProductPayload>();

  async function saveProduct(values: ProductPayload) {
    await mutateAsync({ resource: "products", values });
    navigate("/products");
  }

  return <ProductForm onSave={saveProduct} />;
}
