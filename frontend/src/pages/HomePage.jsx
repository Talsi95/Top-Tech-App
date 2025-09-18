import ProductList from '../components/ProductList';
import Banner from '../components/Banner';

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