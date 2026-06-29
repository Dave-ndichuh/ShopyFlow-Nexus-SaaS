export default function MarketingLayout({ children }) {
  return (
    <>
      <link rel="preload" href="/vendor/bootstrap/css/bootstrap.min.css" as="style" />
      <link rel="stylesheet" href="/vendor/bootstrap/css/bootstrap.min.css" />
      <link rel="preload" href="https://use.fontawesome.com/releases/v5.8.1/css/all.css" as="style" />
      <link
        rel="stylesheet"
        href="https://use.fontawesome.com/releases/v5.8.1/css/all.css"
        integrity="sha384-50oBUHEmvpQ+1lW4y57PTFmhCaXp0ML5d60M1M7uH2+nqUivzIebhndOJK28anvf"
        crossOrigin="anonymous"
      />
      <link rel="preload" href="/assets/css/templatemo-chain-app-dev.css" as="style" />
      <link rel="stylesheet" href="/assets/css/templatemo-chain-app-dev.css" />
      <link rel="preload" href="/assets/css/animated.css" as="style" />
      <link rel="stylesheet" href="/assets/css/animated.css" />
      
      <div className="landing-page">
        {children}
      </div>
    </>
  );
}
