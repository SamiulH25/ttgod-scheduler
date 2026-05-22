function escapeForInlineScript(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

/** Runs before paint so squad themes apply even before next-themes hydrates. */
export function ThemeInitScript({ theme }: { theme: string }) {
  const safePref = escapeForInlineScript(theme);
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `(function(){
var pref="${safePref}";
var resolved=pref==="system"?(window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"):pref;
try{
  localStorage.setItem("ttgod-theme",pref);
  localStorage.removeItem("theme");
}catch(e){}
try{
  document.documentElement.setAttribute("data-theme",resolved);
  var dark=resolved==="dark"||resolved==="bob2142"||resolved==="voicedrew"||resolved==="crainingaming";
  document.documentElement.style.colorScheme=dark?"dark":"light";
}catch(e){}
})();`,
      }}
    />
  );
}
