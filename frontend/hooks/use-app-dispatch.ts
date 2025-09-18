import { useDispatch } from 'react-redux';
import { AppDispatch } from '@/lib/store';

export const useAppDispatch = () => useDispatch<AppDispatch>();
