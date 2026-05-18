
import { toast } from "sonner";

export const useToast = () => {
  return {
    toast: (props) => {
      if (props.variant === "destructive") {
        toast.error(props.title, { description: props.description });
      } else {
        toast.success(props.title, { description: props.description });
      }
    }
  };
};
