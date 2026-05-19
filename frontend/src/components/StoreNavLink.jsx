import React from 'react';
import { NavLink } from 'react-router-dom';
import { useStore } from '../StoreContext';

const StoreNavLink = ({ to, children, ...props }) => {
   const storeContext = useStore();
   const slug = storeContext ? storeContext.slug : null;

   const isAbsolute = typeof to === 'string' && to.startsWith('/');
   const newTo = (isAbsolute && slug) ? `/store/${slug}${to === '/' ? '' : to}` : to;

   return <NavLink to={newTo} {...props}>{children}</NavLink>;
};

export default StoreNavLink;
