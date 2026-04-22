/**
 * Store 冒烟脚本
 * 作用：快速验证关键 action（publishHomework / addToast / removeToast）是否正确挂载到 store
 */
import { useStore } from './store';
const state = useStore.getState();
console.log('publishHomework type:', typeof state.publishHomework);
console.log('addToast type:', typeof state.addToast);
console.log('removeToast type:', typeof state.removeToast);
