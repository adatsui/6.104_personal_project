// Lets TypeScript files import .vue components. Vite compiles the components.
declare module "*.vue" {
  import type { DefineComponent } from "vue";
  const component: DefineComponent<object, object, unknown>;
  export default component;
}

// Lets TypeScript files import stylesheets. Vite bundles them.
declare module "*.css";
