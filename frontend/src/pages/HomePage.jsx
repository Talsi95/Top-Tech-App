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
        <div className="max-w-[1440px] mx-auto p-6 md:p-12">
            <Banner />
            <div className="mb-12">
                <h2 className="text-4xl font-black text-gray-900 mb-8 tracking-tight border-r-8 border-primary pr-6">הנבחרת שלנו</h2>
                <ProductList
                    products={products}
                    onAddToCart={handleAddToCart}
                    showNotification={showNotification}
                    onDeleteProduct={handleDeleteProduct}
                />
            </div>
        </div>
    )
};

export default HomePage;