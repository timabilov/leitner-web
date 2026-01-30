import { AudioLines, File, Image, Layers, School2Icon, Text } from "lucide-react";
import { ISO_TO_LANGUAGE } from "@/services/config";



export const getTypeIcon = (type: string, size?: number) => {
  const iconsSizeClass = size ? `h-${size} w-${size}` : "h-3 w-3";
  switch (type) {
    case "multi":
      return (
        <Layers className={"text-stone-950 " + iconsSizeClass} />
        // <Lottie 
        //     animationData={folderAnimation} 
        //     loop={true} 
        //     autoplay={true}
        //     //style={{ width: "100%", height: "100%" }}
        //     className={"text-muted-foreground " + iconsSizeClass}
        //   />
      );
    case "youtube":
      return (
        <svg xmlns="http://www.w3.org/2000/svg" enableBackground="new 0 0 124 124" viewBox="0 0 124 124" id="youtube">
  <path fill="#333033" d="M107.2,50c0-10.9-8.8-19.7-19.7-19.7h-51c-10.9,0-19.7,8.8-19.7,19.7V74
				c0,10.9,8.8,19.7,19.7,19.7h51c10.9,0,19.7-8.8,19.7-19.7V50z M75,63.2L54.7,74.4c-0.9,0.5-1.7-0.2-1.7-1.2V50.3
				c0-1,0.8-1.7,1.7-1.2l20.5,11.7C76.1,61.4,75.9,62.7,75,63.2z"></path>
</svg>

      // <Youtube className={"text-stone-950 " + iconsSizeClass} />
      //  <Lottie 
      //       animationData={youtubeAnimation} 
      //       loop={true} 
      //       autoplay={true}
      //       //style={{ width: "100%", height: "100%" }}
      //       className={"text-muted-foreground " + iconsSizeClass}
      //     />
    )
    case "audio":
      return (
        <AudioLines className={"text-stone-950 " + iconsSizeClass} />
        // <Lottie 
        //     animationData={audioAnimation} 
        //     loop={true} 
        //     autoplay={true}
        //     //style={{ width: "100%", height: "100%" }}
        //     className={"text-muted-foreground " + iconsSizeClass}
        //   />
      );
    case "image":
      return (
      <Image className={"text-stone-950 " + iconsSizeClass} />
      // <Lottie 
      //       animationData={imageAnimation} 
      //       loop={true} 
      //       autoplay={true}
      //       //style={{ width: "100%", height: "100%" }}
      //       className={"text-muted-foreground " + iconsSizeClass}
      //     />
      )
    case "pdf":
      return (
      <File className={"text-stone-950 " + iconsSizeClass} />
      //  <Lottie 
      //       animationData={pdfAnimation} 
      //       loop={true} 
      //       autoplay={true}
      //       //style={{ width: "100%", height: "100%" }}
      //       className={"text-muted-foreground " + iconsSizeClass}
      //     />
      )
    case "test":
      return (
        <School2Icon className={"text-stone-950 " + iconsSizeClass} />
      );
    case "text":
      return <Text className={"text-stone-950 " + iconsSizeClass} />;
    default:
      return (
        <Layers className={"text-stone-950 " + iconsSizeClass} />
      );
  }
};

export const getNoteLanguageIso = (lang) => {
  const languageInfo = Object.values(ISO_TO_LANGUAGE).find(
    (info) => info.lng_code === lang
  );
  return languageInfo ? languageInfo.flag : "🏳️";
};

