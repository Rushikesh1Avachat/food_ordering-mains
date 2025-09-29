import { create } from "zustand";
import { images } from "@/constants";

interface UserState {
  name: string;
  email: string;
  phone: string;
  address1: string;
  address2: string;
  avatar: { uri: string } | number; // <-- uri must always be string

  setName: (name: string) => void;
  setEmail: (email: string) => void;
  setPhone: (phone: string) => void;
  setAddress1: (address: string) => void;
  setAddress2: (address: string) => void;
  setAvatar: (avatar: { uri: string } | number) => void;
}

export const useUserStore = create<UserState>((set) => ({
  name: "Adrian Hajdin",
  email: "adrian@gmail.com",
  phone: "+1 555 123 4567",
  address1: "123 Main Street, Springfield, IL 62704",
  address2: "221B Rose Street, Foodville, FL 12345",
  avatar: require("@/assets/images/avatar.png").avatar as number, // number for local default

  setName: (name) => set({ name }),
  setEmail: (email) => set({ email }),
  setPhone: (phone) => set({ phone }),
  setAddress1: (address1) => set({ address1 }),
  setAddress2: (address2) => set({ address2 }),
  setAvatar: (avatar) => set({ avatar }),
}));
