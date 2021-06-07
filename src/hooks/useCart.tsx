import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
  const storagedCart = localStorage.getItem('@RocketShoes:cart')

  if (storagedCart) {
    return JSON.parse(storagedCart);
  }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {

      const stock: Stock = await api.get(`stock/${productId}`)
      .then(res => res.data);

      const productAlreadyOnCart = cart.find(product => product.id === productId);

      if(productAlreadyOnCart){

        if(productAlreadyOnCart.amount < stock.amount){
          const newCart = cart.map(cartItem => {
            if(cartItem === productAlreadyOnCart){
              cartItem.amount++
            }
            return cartItem;
          })

          localStorage.setItem('@RocketShoes:cart', JSON.stringify(cart));
          setCart(newCart);

        } else{          
          toast.error('Quantidade solicitada fora de estoque');
        }

      } else {
        const product: Product = await api.get(`products/${productId}`)
        .then(res => res.data);

        if(stock.amount < 1){
          toast.error('Quantidade solicitada fora de estoque');
        } else {
          product.amount = 1
          localStorage.setItem('@RocketShoes:cart', JSON.stringify([...cart, product]))
          setCart([...cart, product]);
        }
      }
    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const productIndex = cart.findIndex((product) => product.id === productId);

      if(productIndex > -1) {
        const newCart = cart.filter(product => product.id !== productId);

        localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
        setCart(newCart);
      } else {
        toast.error('Erro na remoção do produto');
      }
    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      const stock: Stock = await api.get(`stock/${productId}`)
      .then(res => (res.data));

      const products = [...cart]
      const productToBeUpdated = products.find(product => product.id === productId);

      if(amount <= 0){
        return
      }

      if(productToBeUpdated){

        if(amount < stock.amount){
          productToBeUpdated.amount = amount;

          localStorage.setItem('@RocketShoes:cart', JSON.stringify(products));
          setCart(products)
        } else{
          toast.error('Quantidade solicitada fora de estoque');
        }

      } 
    } catch {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
