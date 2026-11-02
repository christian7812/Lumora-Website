import {Refine,} from "@refinedev/core";
import { DevtoolsPanel, DevtoolsProvider } from "@refinedev/devtools";
import { RefineKbar, RefineKbarProvider } from "@refinedev/kbar";

import { BrowserRouter, Route, Routes, Outlet } from "react-router";
import routerProvider, { UnsavedChangesNotifier,DocumentTitleHandler,
} from "@refinedev/react-router";
import { dataProvider } from "./providers/data";
import { AuthProvider, RequireAdmin, adminAuthProvider } from "./providers/auth-context";
import { Layout } from "./components/refine-ui/layout/layout";
import { useNotificationProvider } from "./components/refine-ui/notification/use-notification-provider";
import { Toaster } from "./components/refine-ui/notification/toaster";
import { ThemeProvider } from "./components/refine-ui/theme/theme-provider";
import "./App.css";
import DashboardPage from "./pages/Dashoard";
import ProductsPage from "./pages/Products";
import CreateProductPage from "./pages/Products/create";
import EditProductPage from "./pages/Products/edit";
import CategoriesPage from "./pages/Catergory";
import CreateCategoryPage from "./pages/Catergory/create";
import EditCategoryPage from "./pages/Catergory/edit";
import CustomersPage from "./pages/Customers";
import OrdersList from "./pages/Orders/list";
import OrderDetailsPage from "./pages/Orders/show";
import CustomerShow from "./pages/Customers/show";
import ContactMessagesPage from "./pages/ContactMessages";
import ContactMessageShow from "./pages/ContactMessages/show";

function App() {
  return (
    <BrowserRouter>
      <RefineKbarProvider>
        <ThemeProvider>
          <AuthProvider>
          <DevtoolsProvider>
            <Refine
              dataProvider={dataProvider}
              authProvider={adminAuthProvider}
              notificationProvider={useNotificationProvider()}
              routerProvider={routerProvider}
              options={{
                syncWithLocation: true,
                warnWhenUnsavedChanges: true,
                projectId: "E2qlz5-Stckgt-5e9p6k",
              }}
              resources={[
                {
                  name: 'dashboard',
                  list: '/',
                  meta: {label: 'Dashboard'}
                },
                {
                  name: 'products',
                  list: '/products',
                  create: '/products/create',
                  edit: '/products/edit/:id',
                  show: '/products/show/:id',
                  meta: {label: 'Products'}
                }
                ,
                {
                  name: 'categories',
                  list: '/categories',
                  create: '/categories/create',
                  edit: '/categories/edit/:id',
                  meta: {label: 'Category'}
                },
                {
                  name: 'orders',
                  list: '/orders',
                  create: '/orders/create',
                  show: '/orders/show/:id',
                  meta: {label: 'Orders'}
                },
                {
                  name: 'customers',
                  list: '/customers',
                  show: '/customers/show/:id',
                  meta: {label: 'Customers'}
                }
                ,
                { name: 'contact', list: '/contact', show: '/contact/show/:id', meta: { label: 'Contact Inbox' } }
              ]}
            >
              <Routes>
                <Route element={<Layout>
                  <RequireAdmin>
                  <Outlet />
                  </RequireAdmin>
                </Layout>}

                >
                  <Route index element={<DashboardPage />} />
                  <Route path="products" element={<ProductsPage />}></Route>
                  <Route path="products/create" element={<CreateProductPage />} />
                  <Route path="products/edit/:id" element={<EditProductPage />} />
                  <Route path="categories" element={<CategoriesPage />}></Route>
                  <Route path="categories/create" element={<CreateCategoryPage />} />
                  <Route path="categories/edit/:id" element={<EditCategoryPage />} />
                  <Route path="orders" element={<OrdersList />} />
                  <Route path="orders/show/:id" element={<OrderDetailsPage />} />
                  <Route path="customers" element={<CustomersPage/>}></Route>
                  <Route path="customers/show/:id" element={<CustomerShow />} />
                  <Route path="contact" element={<ContactMessagesPage />} />
                  <Route path="contact/show/:id" element={<ContactMessageShow />} />
                </Route>
              </Routes>
              <Toaster />
              <RefineKbar />
              <UnsavedChangesNotifier />
              <DocumentTitleHandler />
            </Refine>
            <DevtoolsPanel />
          </DevtoolsProvider>
          </AuthProvider>
        </ThemeProvider>
      </RefineKbarProvider>
    </BrowserRouter>
  );
}

export default App;
