import { createSlice } from "@reduxjs/toolkit";



const cartSlice = createSlice({
    name: 'cart',
    initialState: {
        items: localStorage.getItem('cartItems') ? JSON.parse(localStorage.getItem('cartItems')) : [],
        loading: false,
        shippingInfo: localStorage.getItem('shippingInfo') ? JSON.parse(localStorage.getItem('shippingInfo')) : {}
    },
    reducers: {
        addCartItemRequest(state, action) {
            return {
                ...state,
                loading: true
            }
        },
        addCartItemSuccess(state, action) {
            const item = action.payload

            // check already have this yes or no use with product id
            const isItemExist = state.items.find(i => i.product === item.product);

            if (isItemExist) {
                state = {
                    ...state,
                    loading: false,
                }
            } else {
                state = {
                    items: [...state.items, item],
                    loading: false
                }

                // update new itngsin cartItems in Local Storage
                localStorage.setItem('cartItems', JSON.stringify(state.items));
            }
            return state

        },

        // Handle Quentity in cart
        increaseCartItemQty(state, action) {
            state.items = state.items.map(item => {
                if (item.product === action.payload) {
                    item.quantity = item.quantity + 1
                }
                return item;
            })
            // update new qty
            localStorage.setItem('cartItems', JSON.stringify(state.items));

        },
        decreaseCartItemQty(state, action) {
            state.items = state.items.map(item => {
                if (item.product === action.payload) {
                    item.quantity = item.quantity - 1
                }
                return item;
            })
            // update new qty
            localStorage.setItem('cartItems', JSON.stringify(state.items));

        },

        // remove item from cart
        removeItemFromCart(state, action) {

            const filterItems = state.items.filter(item => {
                return item.product !== action.payload
            })
            // update new qty
            localStorage.setItem('cartItems', JSON.stringify(filterItems));
            return {
                ...state,
                items: filterItems
            }
        },

        // save to Local Storage shipping infor
        saveShippingInfo(state, action) {
            localStorage.setItem('shippingInfo', JSON.stringify(action.payload));
            return {
                ...state,
                shippingInfo: action.payload
            }
        },
        
        // clear local storage data and session storage data after order success
        orderCompleted(state, action) {
            localStorage.removeItem('shippingInfo');
            localStorage.removeItem('cartItems');
            sessionStorage.removeItem('orderInfo');
            return {
                items: [],
                loading: false,
                shippingInfo: {}
            }
        }

    }
});

const { actions, reducer } = cartSlice;

export const {
    addCartItemRequest,
    addCartItemSuccess,
    decreaseCartItemQty,
    increaseCartItemQty,
    removeItemFromCart,
    saveShippingInfo,
    orderCompleted
} = actions;

export default reducer;

