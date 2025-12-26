import Lottie from "lottie-react";
import audioAnimation from './recording.json';
import folderAnimation from './folder.json';
import imageAnimation from './image.json';
import pdfAnimation from './pdf.json';
import youtubeAnimation from './youtube.json';
import { AudioLines, File, FolderOpenDot, Image, School2Icon, Text, Youtube } from "lucide-react";
import { ISO_TO_LANGUAGE } from "@/services/config";



export const getTypeIcon = (type: string, size?: number) => {
  const iconsSizeClass = size ? `h-${size} w-${size}` : "h-5 w-5";
  switch (type) {
    case "multi":
      return (
        <FolderOpenDot className={"text-muted-foreground " + iconsSizeClass} />
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
      <Youtube className={"text-muted-foreground " + iconsSizeClass} />
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
        <AudioLines className={"text-muted-foreground " + iconsSizeClass} />
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
      <Image className={"text-muted-foreground " + iconsSizeClass} />
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
      <File className={"text-muted-foreground " + iconsSizeClass} />
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
        <School2Icon className={"text-muted-foreground " + iconsSizeClass} />
      );
    case "text":
      return <Text className={"text-muted-foreground " + iconsSizeClass} />;
    default:
      return (
        <FolderOpenDot className={"text-muted-foreground " + iconsSizeClass} />
      );
  }
};

export const getNoteLanguageIso = (lang) => {
  const languageInfo = Object.values(ISO_TO_LANGUAGE).find(
    (info) => info.lng_code === lang
  );
  return languageInfo ? languageInfo.flag : "🏳️";
};

