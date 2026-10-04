/* eslint-disable */

// @ts-nocheck

// noinspection JSUnusedGlobalSymbols

import { Route as rootRouteImport } from './routes/__root'
import { Route as ApiRouteImport } from './routes/api'
import { Route as DashboardRouteImport } from './routes/dashboard'
import { Route as AdminRouteImport } from './routes/admin'
import { Route as IndexRouteImport } from './routes/index'
import { Route as LoginRouteImport } from './routes/login'
import { Route as PaymentRouteImport } from './routes/payment'
import { Route as RegisterRouteImport } from './routes/register'

const ApiRoute = ApiRouteImport.update({
  id: '/api',
  path: '/api',
  getParentRoute: () => rootRouteImport,
} as any)

const AdminRoute = AdminRouteImport.update({
  id: '/admin',
  path: '/admin',
  getParentRoute: () => rootRouteImport,
} as any)

const DashboardRoute = DashboardRouteImport.update({
  id: '/dashboard',
  path: '/dashboard',
  getParentRoute: () => rootRouteImport,
} as any)

const IndexRoute = IndexRouteImport.update({
  id: '/',
  path: '/',
  getParentRoute: () => rootRouteImport,
} as any)

const LoginRoute = LoginRouteImport.update({
  id: '/login',
  path: '/login',
  getParentRoute: () => rootRouteImport,
} as any)

const PaymentRoute = PaymentRouteImport.update({
  id: '/payment',
  path: '/payment',
  getParentRoute: () => rootRouteImport,
} as any)

const RegisterRoute = RegisterRouteImport.update({
  id: '/register',
  path: '/register',
  getParentRoute: () => rootRouteImport,
} as any)

export interface FileRoutesByFullPath {
  '/admin': typeof AdminRoute
  '/': typeof IndexRoute
  '/api': typeof ApiRoute
  '/dashboard': typeof DashboardRoute
  '/login': typeof LoginRoute
  '/payment': typeof PaymentRoute
  '/register': typeof RegisterRoute
}
export interface FileRoutesByTo {
  '/admin': typeof AdminRoute
  '/': typeof IndexRoute
  '/api': typeof ApiRoute
  '/dashboard': typeof DashboardRoute
  '/login': typeof LoginRoute
  '/payment': typeof PaymentRoute
  '/register': typeof RegisterRoute
}
export interface FileRoutesById {
  __root__: typeof rootRouteImport
  '/admin': typeof AdminRoute
  '/': typeof IndexRoute
  '/api': typeof ApiRoute
  '/dashboard': typeof DashboardRoute
  '/login': typeof LoginRoute
  '/payment': typeof PaymentRoute
  '/register': typeof RegisterRoute
}
export interface FileRouteTypes {
  fileRoutesByFullPath: FileRoutesByFullPath
  fullPaths: '/' | '/admin' | '/api' | '/dashboard' | '/login' | '/payment' | '/register'
  fileRoutesByTo: FileRoutesByTo
  to: '/' | '/admin' | '/api' | '/dashboard' | '/login' | '/payment' | '/register'
  id: '__root__' | '/' | '/admin' | '/api' | '/dashboard' | '/login' | '/payment' | '/register'
  fileRoutesById: FileRoutesById
}
export interface RootRouteChildren {
  AdminRoute: typeof AdminRoute
  ApiRoute: typeof ApiRoute
  DashboardRoute: typeof DashboardRoute
  IndexRoute: typeof IndexRoute
  LoginRoute: typeof LoginRoute
  PaymentRoute: typeof PaymentRoute
  RegisterRoute: typeof RegisterRoute
}

declare module '@tanstack/react-router' {
  interface FileRoutesByPath {
    '/admin': {
      id: '/admin'
      path: '/admin'
      fullPath: '/admin'
      preLoaderRoute: typeof AdminRouteImport
      parentRoute: typeof rootRouteImport
    }
    '/': {
      id: '/'
      path: '/'
      fullPath: '/'
      preLoaderRoute: typeof IndexRouteImport
      parentRoute: typeof rootRouteImport
    }
    '/api': {
      id: '/api'
      path: '/api'
      fullPath: '/api'
      preLoaderRoute: typeof ApiRouteImport
      parentRoute: typeof rootRouteImport
    }
    '/dashboard': {
      id: '/dashboard'
      path: '/dashboard'
      fullPath: '/dashboard'
      preLoaderRoute: typeof DashboardRouteImport
      parentRoute: typeof rootRouteImport
    }
    '/login': {
      id: '/login'
      path: '/login'
      fullPath: '/login'
      preLoaderRoute: typeof LoginRouteImport
      parentRoute: typeof rootRouteImport
    }
    '/payment': {
      id: '/payment'
      path: '/payment'
      fullPath: '/payment'
      preLoaderRoute: typeof PaymentRouteImport
      parentRoute: typeof rootRouteImport
    }
    '/register': {
      id: '/register'
      path: '/register'
      fullPath: '/register'
      preLoaderRoute: typeof RegisterRouteImport
      parentRoute: typeof rootRouteImport
    }
  }
}

const rootRouteChildren: RootRouteChildren = {
  AdminRoute,
  ApiRoute,
  DashboardRoute,
  IndexRoute,
  LoginRoute,
  PaymentRoute,
  RegisterRoute,
}
export const routeTree = rootRouteImport
  ._addFileChildren(rootRouteChildren)
  ._addFileTypes<FileRouteTypes>()

import type { getRouter } from './router.tsx'
import type { startInstance } from './start.ts'
declare module '@tanstack/react-start' {
  interface Register {
    ssr: true
    router: Awaited<ReturnType<typeof getRouter>>
    config: Awaited<ReturnType<typeof startInstance.getOptions>>
  }
}
