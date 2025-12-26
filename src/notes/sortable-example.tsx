import { useEffect, useState } from "react";
import { cn } from "@/lib/utils"; // Assuming you have this utility from shadcn/ui
import { NoteCard } from "./note-card";
// import NoteCard2 from "./note-card";


export default function SortableGrid({ data, view }) {
  const [items, setItems] = useState([]);

  useEffect(() => {
    setItems(Array.isArray(data) ? data : []);
  }, [data]);

  return (
    <div
      className={cn(
        "w-full p-4 grid gap-4",
        // We look up the correct class from our map
        view === 'grid' ? "sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-3" : "grid-cols-1"
      )}
    >
      {/* 
        The <Sortable> wrapper would go here if you are using a library like `dnd-kit`
        For example:
        <Sortable value={items} onValueChange={handleValueChange} getItemValue={getItemValue}>
      */}
      {/* {items.map((item) => <NoteCard0  item={item}  view={view}/> )} */}
      {items.map((item) => <NoteCard  item={item}  view={view}/> )}
      {/* {items.map((item) => <NoteCard2  item={item}  view={view}/> )}
      {items.map((item) => <NoteCard3  item={item}  view={view}/> )}
      {items.map((item) => <NoteCard4  item={item}  view={view}/> )} */}
      {/* 
        </Sortable> 
      */}
    </div>
  );
}