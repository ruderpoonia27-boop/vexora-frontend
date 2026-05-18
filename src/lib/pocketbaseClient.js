// PocketBase client is no longer used - all data is fetched from MongoDB backend API
// This file is kept for backwards compatibility but returns a mock client
const pocketbaseClient = {
  collection: () => ({
    getList: () => Promise.resolve({ items: [], totalItems: 0 }),
    getOne: () => Promise.resolve(null),
    create: () => Promise.resolve({}),
    update: () => Promise.resolve({}),
    delete: () => Promise.resolve({}),
    subscribe: () => {},
    unsubscribe: () => {}
  })
};

export default pocketbaseClient;
export { pocketbaseClient };