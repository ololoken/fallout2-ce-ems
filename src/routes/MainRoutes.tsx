import Loadable from '../components/Loadable';
import MainLayout from '../layouts/MainLayout';
import { lazy } from 'react';

const NotFoundError = Loadable(lazy(() => import('../pages/error/40X')));
const UnexpectedError = Loadable(lazy(() => import('../pages/error/50X')));

const Launcher = Loadable(lazy(() => import('../pages/Launcher')));

export default {
  path: `${import.meta.env.BASE_URL}`,
  children: [
    {
      element: <MainLayout />,
      children: [
        {
          path: '',
          element: <Launcher />
        },
        {
          path: '*',
          element: <NotFoundError />
        },
        {
          path: 'error',
          element: <UnexpectedError />
        }
      ]
    }
  ]
};
