import Toast from "react-native-toast-message";

export const toast = {
  success(title: string, message?: string) {
    Toast.show({
      type: "success",
      text1: title,
      text2: message,
      position: "top",
      visibilityTime: 2500,
    });
  },

  error(title: string, message?: string) {
    Toast.show({
      type: "error",
      text1: title,
      text2: message,
      position: "top",
      visibilityTime: 3000,
    });
  },

  info(title: string, message?: string) {
    Toast.show({
      type: "info",
      text1: title,
      text2: message,
      position: "top",
      visibilityTime: 2500,
    });
  },
};