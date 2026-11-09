import { request, mutation } from '../transport';


export const exportData = () => request<unknown>("/me/data-export");

export const deleteAccount = (password: string) => mutation<void>("/me/account", "DELETE", { password });
