import { useStore } from './store';
const state = useStore.getState();
console.log('publishHomework type:', typeof state.publishHomework);
console.log('addToast type:', typeof state.addToast);
console.log('removeToast type:', typeof state.removeToast);
