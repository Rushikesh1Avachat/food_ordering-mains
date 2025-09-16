import {Account, Avatars, Client, Databases, ID, Query, Storage} from "react-native-appwrite";

import {CreateUserParams, GetMenuParams,  SignInParams, MenuItem, Category} from "@/type";

export const appwriteConfig = {
    endpoint: process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT!,
    projectId: process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID!,
    platform: "com.jsm.foodordering",
    databaseId: '68bec3c1003e19449491',
    userCollectionId: '68bec411001a89b577b8',
      categoriesCollectionId: '68c7b13500167ab5d927',
    customizationsCollectionId: '68c7c015003699ab7694',
      menuCollectionId:  '68c7b25a000dd1794565',
    menuCustomizationsCollectionId: '68c7c17a001887f3afa5',
    bucketId: '68c7c349000327852e2c',
}

export const client = new Client();

client
    .setEndpoint(appwriteConfig.endpoint)
    .setProject(appwriteConfig.projectId)
    .setPlatform(appwriteConfig.platform)

export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client)
const avatars = new Avatars(client);

export const createUser = async ({ email, password, name }: CreateUserParams) => {
  try {
    // Create the account
    const newAccount = await account.create(ID.unique(), email, password, name);
    if (!newAccount) throw new Error("Failed to create account");

    // Sign in immediately (make sure session is ready)
    await signIn({ email, password });

    // Generate avatar
    const avatarUrl = avatars.getInitialsURL(name);

    // Create user profile in DB
    return await databases.createDocument(
      appwriteConfig.databaseId,
      appwriteConfig.userCollectionId,
      ID.unique(),
      { email, name, accountId: newAccount.$id, avatar: avatarUrl }
    );
  } catch (e) {
    console.error("Error creating user:", e);
    throw e;
  }
};

export const signIn = async ({ email, password }: SignInParams) => {
  try {
  await account.deleteSession("current").catch(() => null);

    // Create a new session
    const session = await account.createEmailPasswordSession(email, password);
    return session;
  } catch (e) {
    console.error("Error signing in:", e);
    throw e;
  }
};

export const getCurrentUser = async () => {
  try {
    // Ensure there’s a valid session first
    const session = await account.getSession("current").catch(() => null);
    if (!session) throw new Error("No active session. Please sign in.");

    // Fetch the account
    const currentAccount = await account.get();

    // Fetch user document
    const currentUser = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.userCollectionId,
      [Query.equal("accountId", currentAccount.$id)]
    );

    if (!currentUser.documents.length) {
      throw new Error("User not found in database");
    }

    return currentUser.documents[0];
  } catch (e) {
    console.error("Error fetching current user:", e);
    throw e;
  }
};


export const getMenu = async ({ category, query }: GetMenuParams) => {
    try {
        const queries: string[] = [];

        if(category) queries.push(Query.equal('categories', category));
        if(query) queries.push(Query.search('name', query));

        const menus = await databases.listDocuments(
            appwriteConfig.databaseId,
            appwriteConfig.menuCollectionId,
            queries,
        )
         console.log(menus);
         
        return menus.documents;
    } catch (e) {
        throw new Error(e as string);
    }
}


export const getCategories = async () => {
    try {
        const categories = await databases.listDocuments(
            appwriteConfig.databaseId,
            appwriteConfig.categoriesCollectionId,
        )
         console.log(categories);
         
        return categories.documents;
    } catch (e) {
        throw new Error(e as string);
    }
}