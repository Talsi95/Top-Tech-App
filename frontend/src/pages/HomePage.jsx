import ProductList from '../components/ProductList';
import Banner from '../components/Banner';

/**
 * HomePage Component.
 * The landing page of the application, displaying a hero banner and featured product list.
 * 
 * @param {Object} props - Component props.
 * @param {Function} props.handleAddToCart - Function to add a product to the cart.
 * @param {Function} props.showNotification - Function to display a global notification.
 * @param {Function} props.handleDeleteProduct - Function to delete a product (admin only).
 * @param {Array} props.products - List of products to display.
 */
const HomePage = ({ handleAddToCart, showNotification, handleDeleteProduct, products }) => {

    return (
        <div className="container mx-auto p-4">
            <Banner />
            <ProductList
                products={products}
                onAddToCart={handleAddToCart}
                showNotification={showNotification}
                onDeleteProduct={handleDeleteProduct}
            />
        </div>
    )
};

export default HomePage;