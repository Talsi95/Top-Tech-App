import ProductList from '../components/ProductList';

const HomePage = ({ handleAddToCart, showNotification, handleDeleteProduct, products }) => (
    <ProductList
        products={products}
        onAddToCart={handleAddToCart}
        showNotification={showNotification}
        onDeleteProduct={handleDeleteProduct}
    />
);

export default HomePage;