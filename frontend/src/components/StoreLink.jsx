import React from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../StoreContext';

const StoreLink = ({ to, children, ...props }) => {
   const storeContext = useStore();
   const slug = storeContext ? storeContext.slug : null;

   const isAbsolute = typeof to === 'string' && to.startsWith('/');
   const newTo = (isAbsolute && slug) ? `/store/${slug}${to === '/' ? '' : to}` : to;

   return <Link to={newTo} {...props}>{children}</Link>;
};

export default StoreLink;
