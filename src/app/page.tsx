import { SwRegister } from "@/app/sw-register";
import { EditorShell } from "@/features/editor/components/editor-shell";

export default function Home() {
  return (
    <>
      <SwRegister />
      <EditorShell />
    </>
  );
}
