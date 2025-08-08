const fixedJsonResponse = [
    {
      "_id":"680e601aff175571aa72a483",
      "title": "Galaxy s III mini SM-G730V Verizon Cell Phone BLUE",
      "brand": "Samsung",
      "image": "imageurl",
      "stock": 20,
      "seller": "5f5237a4c1beb1523fa3db73",
      "price": 56.0,
      "reviews": [
        {
          "reviewer": "5f5237a4c1beb1523fa3db1f",
          "rating": 3,
          "comment": "Got phone yesterday all ... the charger!",
          "hidden": ""
        },
        {
          "reviewer": "5f5237a4c1beb1523fa3db1f",
          "rating": 5,
          "comment": "The charging cable is ... phone was good!",
          "hidden": ""
        }
      ]
    },
    {
      "_id":"680e601aff175571aa72a483 ",
      "title": "Sony Ericsson TM506 Unlocked QUAD-Band 3G GSM CellPhone",
      "brand": "Sony",
      "image": "imageurl",
      "stock": 10,
      "seller": "5f5237a4c1beb1523fa3da68",
      "price": 173.0,
      "reviews": [],
      "disabled": ""
    }
  ];

  export const fetchSoldOutSoon = () => {
    return Promise.resolve(fixedJsonResponse);
  };

  export const fetchBestSellers = () => {
    return Promise.resolve(fixedJsonResponse);
  };

  export const searchItems = (queryString) => {
    console.log(`Search called with query: ${queryString}, but returning fixed JSON.`);
    return Promise.resolve(fixedJsonResponse);
  };
  const API_BASE_URL = '...';

async function request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    };
    const token = localStorage.getItem('authToken');
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, {...options, headers});

    if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
            const errorData = await response.json();
            errorMessage = errorData.message || errorMessage;
        } catch (e) {

        }
        throw new Error(errorMessage);
    }

    const contentType = response.headers.get("content-type");
    if (contentType && contentType.indexOf("application/json") !== -1) {
        return response.json();
    } else {
        return;
    }
  }
export const loginUser = async ({ email, password }) => {
    console.log("Mock login triggered with:", email, password);
    const dummyResponse = {
        success: true,
        token: 'mocked-jwt-token',
        user: {
            id: 'user123',
            email,
            firstName: 'Mock',
            lastName: 'User',
        }
    };
    localStorage.setItem('authToken', dummyResponse.token);
    return dummyResponse;
};
let dummyWishlist = [];
export const checkWishlistStatus = async (itemId) =>{
  return dummyWishlist.some(itemData => itemData.id === itemId);

}
export const getWishlistItems = async () => {
  return [...dummyWishlist];
};

export const addToWishlist = async (ItemData) => {
    dummyWishlist.push(ItemData);
    return { success: true };
};

export const removeFromWishlist = async (itemId) => {
  const initialLength = dummyWishlist.length;
  dummyWishlist = dummyWishlist.filter(ItemData => ItemData.id !== itemId);
  if (dummyWishlist.length < initialLength) {
       return { success: true };
  } else {
       throw new Error("Item not found in wishlist");
  }
};


export const processOrder = async (cartItems) =>{
  return;
};

export const postReview = (reviewData) => request('/reviews', {method: 'POST', body: JSON.stringify(reviewData)});
export const toggleReviewVisibility = (reviewId, isHidden) => request(`/reviews/${reviewId}/visibility`, {
    method: 'PATCH',
    body: JSON.stringify({isHidden})
});
export const getUserListings = () => request('/profile/listings');
export const addListing = (listingData) => request('/profile/listings', {
    method: 'POST',
    body: JSON.stringify(listingData)
});
export const updateListing = (listingId, listingData) => request(`/profile/listings/${listingId}`, {
    method: 'PUT',
    body: JSON.stringify(listingData)
});
export const toggleListingStatus = (listingId, isEnabled) => request(`/profile/listings/${listingId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({isEnabled})
});
export const deleteListing = (listingId) => request(`/profile/listings/${listingId}`, {method: 'DELETE'});
export const getCommentsForUserListings = () => request('/profile/listings/comments');

