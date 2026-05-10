// Injeta <style> pra esconder scrollbar do html/body quando a salespage
// (/creativos, /andromeda, /analytics) é renderizada dentro do iframe do
// modal da área de membros (?member=1). Cross-origin impede CSS do parent
// de mexer no conteúdo do iframe — então aplicamos aqui mesmo.
//
// Server Component — sem "use client".
export function MemberModeStyles() {
  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `
          html, body {
            scrollbar-width: none !important;
            -ms-overflow-style: none !important;
          }
          html::-webkit-scrollbar,
          body::-webkit-scrollbar,
          *::-webkit-scrollbar {
            display: none !important;
            width: 0 !important;
            height: 0 !important;
          }
        `,
      }}
    />
  )
}
