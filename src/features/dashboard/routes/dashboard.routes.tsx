/**
 * Configuration des routes du Dashboard Super Admin
 * Lazy loading pour optimisation des performances
 * @module DashboardRoutes
 */

import { lazy } from 'react';
import { RouteObject } from 'react-router-dom';

// Lazy load des composants
const DashboardLayout = lazy(() => import('../components/DashboardLayout'));
const DashboardOverview = lazy(() => import('../pages/DashboardOverview'));
const SchoolGroups = lazy(() => import('../pages/SchoolGroups'));

// Pages à implémenter
const Users = lazy(() => import('../pages/Users'));
const Categories = lazy(() => import('../pages/Categories'));
const Plans = lazy(() => import('../pages/PlansUltimate'));
const Subscriptions = lazy(() => import('../pages/Subscriptions'));
const Modules = lazy(() => import('../pages/Modules'));
const Finances = lazy(() => import('../pages/Finances'));
const Communication = lazy(() => import('../pages/Communication'));
const Reports = lazy(() => import('../pages/Reports'));
const ActivityLogs = lazy(() => import('../pages/ActivityLogs'));
const Trash = lazy(() => import('../pages/Trash'));

/**
 * Routes du dashboard
 */
export const dashboardRoutes: RouteObject = {
  path: '/dashboard',
  element: <DashboardLayout />,
  children: [
    {
      index: true,
      element: <DashboardOverview />,
    },
    {
      path: 'school-groups',
      element: <SchoolGroups />,
    },
    {
      path: 'users',
      element: <Users />,
    },
    {
      path: 'categories',
      element: <Categories />,
    },
    {
      path: 'plans',
      element: <Plans />,
    },
    {
      path: 'subscriptions',
      element: <Subscriptions />,
    },
    {
      path: 'modules',
      element: <Modules />,
    },
    {
      path: 'finances',
      element: <Finances />,
    },
    {
      path: 'communication',
      element: <Communication />,
    },
    {
      path: 'reports',
      element: <Reports />,
    },
    {
      path: 'activity-logs',
      element: <ActivityLogs />,
    },
    {
      path: 'trash',
      element: <Trash />,
    },
  ],
};

export default dashboardRoutes;
