import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import PhoneListingCard from '../components/PhoneListingCard';
import ItemDetailModal from '../components/ItemDetailModal';
import '../styles/main.css';
import * as api from '../services/api';

function MainPage() {
    const { itemId: itemIdFromUrl } = useParams();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const location = useLocation();

    const [homeData, setHomeData] = useState({ soldOutSoon: [], bestSellers: [] });
    const [searchResults, setSearchResults] = useState([]);
    const [isLoadingBackground, setIsLoadingBackground] = useState(false);
    const [backgroundError, setBackgroundError] = useState(null);
    const [selectedItemForModal, setSelectedItemForModal] = useState(null);

    const [selectedBrand, setSelectedBrand] = useState('');
    const [maxPrice, setMaxPrice] = useState(0);
    const [actualMaxPrice, setActualMaxPrice] = useState(0);
    const [filteredDisplayResults, setFilteredDisplayResults] = useState([]);
    
    const queryFromUrl = useMemo(() => searchParams.get('q'), [searchParams]);
    const isSearchMode = useMemo(() => queryFromUrl !== null, [queryFromUrl]);

    const backgroundPath = useMemo(() => {
        if (isSearchMode && queryFromUrl) {
            return `/search?q=${encodeURIComponent(queryFromUrl)}`;
        }
        return '/';
    }, [isSearchMode, queryFromUrl]);

    const queryTerm = useMemo(() => queryFromUrl || '', [queryFromUrl]);

    const availableBrands = useMemo(() => {
        const brands = new Set(searchResults.map(phone => phone.brand));
        return ['All Brands', ...Array.from(brands).sort()];
    }, [searchResults, isSearchMode]);

    useEffect(() => {
        if (isSearchMode && searchResults.length > 0) {
            const maxPriceFromResult = Math.max(...searchResults.map(phone => phone.price));
            setActualMaxPrice(maxPriceFromResult);
            setMaxPrice(maxPriceFromResult);
            setSelectedBrand('');
        } else if (!isSearchMode) {
             setActualMaxPrice(0);
             setMaxPrice(0);
             setSelectedBrand('');
        }
    }, [searchResults, isSearchMode]);


    useEffect(() => {
        if (!isSearchMode) {
            setFilteredDisplayResults([]); 
            return;
        }

        let results = [...searchResults];

        if (selectedBrand && selectedBrand !== 'All Brands') {
            results = results.filter(phone => phone.brand === selectedBrand);
        }

        if (actualMaxPrice > 0) {
            results = results.filter(phone => phone.price <= maxPrice);
        }

        setFilteredDisplayResults(results);
    }, [searchResults, selectedBrand, maxPrice, actualMaxPrice, isSearchMode]);


    const fetchBackgroundData = useCallback(async () => {
        setIsLoadingBackground(true);
        setBackgroundError(null);
        if (!isSearchMode || !queryFromUrl) {
            setSearchResults([]);
            setFilteredDisplayResults([]);
            if (!isSearchMode) {
                setHomeData({ soldOutSoon: [], bestSellers: [] });
            }
        }

        try {
            if (isSearchMode && queryFromUrl) {
                setHomeData({ soldOutSoon: [], bestSellers: [] });
                const results = await api.searchItems(`queryString=${encodeURIComponent(queryFromUrl)}`);
                setSearchResults((results?.phonelist || []).filter(item => !item.disabled).map(item => ({...item, _id: String(item._id)})));
            } else if (!isSearchMode) { 
                setSearchResults([]);
                setFilteredDisplayResults([]);
                const [soldOutResult, bestSellersResult] = await Promise.all([
                    api.fetchSoldOutSoon(),
                    api.fetchBestSellers()
                ]);
                setHomeData({
                    soldOutSoon: (soldOutResult?.phonelist || []).map(item => ({...item, _id: String(item._id)})),
                    bestSellers: (bestSellersResult?.bestSellers || []).map(item => ({...item, _id: String(item._id)}))
                });
            }
            setBackgroundError(null);
        } catch (err) {
            console.error("MainPage: Failed to fetch background data:", err);
            if (err.message === "There is no item contains the search String.") {
                setBackgroundError(null);
            } else {
                setBackgroundError(err.message || "Could not load page content. Please try refreshing.");
            }
            setHomeData({ soldOutSoon: [], bestSellers: [] });
            setSearchResults([]);
            setFilteredDisplayResults([]);
        } finally {
            setIsLoadingBackground(false);
        }
    }, [isSearchMode, queryFromUrl]);

    useEffect(() => {
        fetchBackgroundData();
    }, [fetchBackgroundData]);

     const handleSelectItem = (phone) => {
        if (phone && phone._id) {
            setSelectedItemForModal(phone);
            let queryString = '';
            if (isSearchMode && queryFromUrl) {
                queryString = `?q=${encodeURIComponent(queryFromUrl)}`;
            }
            const targetUrl = `/item/${phone._id}${queryString}`;
            navigate(targetUrl, { replace: true, state: { backgroundLocation: location } });
        }
    };

    const handleCloseModal = () => {
        setSelectedItemForModal(null);
        navigate(backgroundPath, { replace: true }); 
    };
    const handleBrandChange = (event) => {
        setSelectedBrand(event.target.value);
    };

    const handleReviewPostedOnMainPage = (itemId, newReview) => {
        const updateItemWithNewReview = (itemToUpdate) => {
            if (String(itemToUpdate._id) === String(itemId)) {
                const newReviewerId = String(newReview.reviewer);
                const existingReviews = itemToUpdate.reviews || [];
                
                const otherUserReviews = existingReviews.filter(r => String(r.reviewer) !== newReviewerId);
                const updatedReviews = [...otherUserReviews, newReview].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

                return { ...itemToUpdate, reviews: updatedReviews };
            }
            return itemToUpdate;
        };

        if (isSearchMode) {
            setSearchResults(prevResults => prevResults.map(updateItemWithNewReview));
        } else {
            setHomeData(prevHomeData => ({
                soldOutSoon: prevHomeData.soldOutSoon.map(updateItemWithNewReview),
                bestSellers: prevHomeData.bestSellers.map(updateItemWithNewReview),
            }));
        }
        if (selectedItemForModal && String(selectedItemForModal._id) === String(itemId)) {
            setSelectedItemForModal(prevItem => updateItemWithNewReview(prevItem));
        }
    };

    const handleItemUpdateInModal = (updatedItemFromModal) => {
        const updateItemInList = (items) =>
            items.map(item =>
                String(item._id) === String(updatedItemFromModal._id) ? updatedItemFromModal : item
            );

        if (isSearchMode) {
            setSearchResults(prevResults => updateItemInList(prevResults));
        } else {
            setHomeData(prevHomeData => ({
                soldOutSoon: updateItemInList(prevHomeData.soldOutSoon),
                bestSellers: updateItemInList(prevHomeData.bestSellers),
            }));
        }

        if (selectedItemForModal && String(selectedItemForModal._id) === String(updatedItemFromModal._id)) {
            setSelectedItemForModal(updatedItemFromModal);
        }
    };
    const handlePriceChange = (event) => {
        setMaxPrice(Number(event.target.value));
    };

    const renderBackgroundContent = () => {
        if (isLoadingBackground) {
            return <div className="loading-container page-section"><p>Loading content...</p></div>;
        }
        if (backgroundError) {
            return <p className="error-message page-section">{backgroundError}</p>;
        }

        if (isSearchMode) {
            return (
                <div className="search-results-page page-section">
                    <div className="search-results-header">
                        <h2>Results for: "{queryTerm}"</h2>
                    </div>

                    <div className="search-layout-container">
                        <aside className="search-filters-sidebar">
                            <h3>Filters</h3>
                            <div className="filter-group">
                                <label htmlFor="brand-select">Brand:</label>
                                <select
                                    id="brand-select"
                                    value={selectedBrand}
                                    onChange={handleBrandChange}
                                    disabled={searchResults.length === 0}
                                >
                                    {availableBrands.map(brand => (
                                        <option key={brand} value={brand === 'All Brands' ? '' : brand}>
                                            {brand}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="filter-group">
                                <label htmlFor="price-range">Max Price: ${maxPrice}</label>
                                <input
                                    type="range"
                                    id="price-range"
                                    min="0"
                                    max={actualMaxPrice}
                                    value={maxPrice}
                                    onChange={handlePriceChange}
                                    disabled={actualMaxPrice === 0 || searchResults.length === 0}
                                />
                                 <div className="price-range-labels">
                                    <span>$0</span>
                                    <span>${actualMaxPrice}</span>
                                </div>
                            </div>
                        </aside>

                        <main className="search-results-area">
                             <div className="phone-list">
                                {filteredDisplayResults.length > 0 ? (
                                    filteredDisplayResults.map((phone) => (
                                        <div key={phone._id} onClick={() => handleSelectItem(phone)} style={{ cursor: 'pointer' }} role="button" tabIndex="0" onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleSelectItem(phone); }}>
                                            <PhoneListingCard phone={phone} type="search" />
                                        </div>
                                    ))
                                ) : searchResults.length > 0 ? (
                                     <p>No items found matching your filters for "{queryTerm}".</p>
                                ) : (
                                     <p>No items found matching your search criteria "{queryTerm}".</p>
                                )}
                            </div>
                        </main>
                    </div>
                </div>
            );
        } else {
            return (
                 <div className="home-content page-section">
                     <section className="content-box sold-out-soon-section">
                        <h2>Sold out soon</h2>
                         <div className="phone-list">
                            {homeData.soldOutSoon.length > 0 ? (
                                homeData.soldOutSoon.map((phone) => (
                                    <div key={phone._id} onClick={() => handleSelectItem(phone)} style={{ cursor: 'pointer' }} role="button" tabIndex="0" onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleSelectItem(phone); }}>
                                        <PhoneListingCard phone={phone} type="home-soldout" />
                                    </div>
                                ))
                            ) : <p>No items nearing sold out currently.</p>}
                        </div>
                    </section>
                    <hr className="section-separator" />
                    <section className="content-box best-sellers-section">
                        <h2>Best sellers</h2>
                        <div className="phone-list">
                            {homeData.bestSellers.length > 0 ? (
                                homeData.bestSellers.map((phone, index) => (
                                    <div key={(phone && phone._id !== undefined && phone._id !== null) ? phone._id : `bestseller-item-${index}`} onClick={() => handleSelectItem(phone)} style={{ cursor: 'pointer' }} role="button" tabIndex="0" onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleSelectItem(phone); }}>
                                        <PhoneListingCard phone={phone} type="home-bestseller" />
                                    </div>
                                ))
                            ) : <p>No best sellers found yet.</p>}
                        </div>
                    </section>
                 </div>
            );
        }
    };

    return (
        <div className="main-page-container">
            {renderBackgroundContent()}
            {selectedItemForModal && (
                <ItemDetailModal
                    initialItem={selectedItemForModal}
                    onClose={handleCloseModal}
                    onReviewPosted={handleReviewPostedOnMainPage}
                    onItemUpdate={handleItemUpdateInModal}
                />
            )}
        </div>
    );
}

export default MainPage;