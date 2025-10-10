import { useDispatch } from 'react-redux';
import { AppDispatch } from './store';
import { TypedUseSelectorHook, useSelector } from 'react-redux';
import { RootState } from './store';

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
