import { useCreate, type HttpError } from "@refinedev/core";
import { useNavigate } from "react-router";
import { CategoryForm, type Category, type CategoryFormValues } from "./CategoryForm";

interface CategoryCreateValues {
  name: string;
  description: string;
}

export default function CreateCategoryPage() {
  const navigate = useNavigate();
  const { mutateAsync } = useCreate<Category, HttpError, CategoryCreateValues>();

  async function saveCategory(values: CategoryFormValues) {
    await mutateAsync({
      resource: "categories",
      values: { name: values.name, description: values.description },
    });
    navigate("/categories");
  }

  return <CategoryForm onSave={saveCategory} />;
}
