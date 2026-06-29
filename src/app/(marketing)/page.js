'use client';

import Link from 'next/link';
import { useEffect } from 'react';

export default function LandingPage() {

  useEffect(() => {
    // If the template relies on some initialization scripts, we could load them dynamically here.
    // However, since we are doing Option A, we will skip the heavy jQuery scripts and just use standard React.
    
    // Add a simple scroll listener for the sticky header
    const handleScroll = () => {
      const header = document.querySelector('.header-area');
      if (header) {
        if (window.scrollY > 50) {
          header.classList.add('background-header');
        } else {
          header.classList.remove('background-header');
        }
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      {/* ***** Header Area Start ***** */}
      <header className="header-area header-sticky wow slideInDown" data-wow-duration="0.75s" data-wow-delay="0s">
        <div className="container">
          <div className="row">
            <div className="col-12">
              <nav className="main-nav">
                {/* ***** Logo Start ***** */}
                <a href="/" className="logo">
                  <h3 style={{ marginTop: '25px', color: '#2b2b2b', fontWeight: 800 }}>Nexus SaaS</h3>
                </a>
                {/* ***** Logo End ***** */}
                {/* ***** Menu Start ***** */}
                <ul className="nav">
                  <li className="scroll-to-section"><a href="#top" className="active">Home</a></li>
                  <li className="scroll-to-section"><a href="#services">Features</a></li>
                  <li className="scroll-to-section"><a href="#about">About</a></li>
                  <li className="scroll-to-section"><a href="#pricing">Pricing</a></li>
                  <li>
                    <div className="gradient-button">
                      <Link href="/login"><i className="fa fa-sign-in-alt"></i> Sign In Now</Link>
                    </div>
                  </li> 
                </ul>        
                <a className="menu-trigger">
                    <span>Menu</span>
                </a>
                {/* ***** Menu End ***** */}
              </nav>
            </div>
          </div>
        </div>
      </header>
      {/* ***** Header Area End ***** */}

      <div className="main-banner wow fadeIn" id="top" data-wow-duration="1s" data-wow-delay="0.5s">
        <div className="container">
          <div className="row">
            <div className="col-lg-12">
              <div className="row">
                <div className="col-lg-6 align-self-center">
                  <div className="left-content show-up header-text wow fadeInLeft" data-wow-duration="1s" data-wow-delay="1s">
                    <div className="row">
                      <div className="col-lg-12">
                        <h2>Next-Generation POS & Retail Management</h2>
                        <p>Nexus SaaS is the ultimate multi-branch POS and ERP designed to unify your sales, inventory, and analytics into one seamless, lightning-fast platform.</p>
                      </div>
                      <div className="col-lg-12">
                        <div className="white-button first-button scroll-to-section">
                          <Link href="/register">Create Workspace <i className="fa fa-rocket"></i></Link>
                        </div>
                        <div className="white-button scroll-to-section">
                          <a href="#features">Explore Features <i className="fa fa-arrow-down"></i></a>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="col-lg-6">
                  <div className="right-image wow fadeInRight" data-wow-duration="1s" data-wow-delay="0.5s">
                    <div className="hero-visual-card">
                      <span className="hero-visual-badge">Live POS</span>
                      <img src="/assets/images/slider-dec.png" alt="Nexus POS dashboard preview" className="custom-illustration" />
                      <div className="hero-visual-caption">
                        <strong>Unified control</strong>
                        Checkout, stock, and analytics in one view
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div id="services" className="services section">
        <div className="container">
          <div className="row">
            <div className="col-lg-8 offset-lg-2">
              <div className="section-heading  wow fadeInDown" data-wow-duration="1s" data-wow-delay="0.5s">
                <h4>Amazing <em>Features &amp; Tools</em> for your business</h4>
                <img src="assets/images/heading-line-dec.png" alt="" />
                <p>Equip your team with enterprise-grade tools tailored for fast checkouts, strict inventory management, and deep financial analytics.</p>
              </div>
            </div>
          </div>
        </div>
        <div className="container">
          <div className="row">
            <div className="col-lg-3">
              <div className="service-item first-service">
                <div className="icon"></div>
                <h4>Lightning Fast POS</h4>
                <p>Execute sales in milliseconds with barcode scanner integration and real-time receipt generation.</p>
                <div className="text-button">
                  <a href="#">Learn More <i className="fa fa-arrow-right"></i></a>
                </div>
              </div>
            </div>
            <div className="col-lg-3">
              <div className="service-item second-service">
                <div className="icon"></div>
                <h4>Multi-Branch Inventory</h4>
                <p>Track every SKU across all your locations. Instantly know what's in stock and where.</p>
                <div className="text-button">
                  <a href="#">Learn More <i className="fa fa-arrow-right"></i></a>
                </div>
              </div>
            </div>
            <div className="col-lg-3">
              <div className="service-item third-service">
                <div className="icon"></div>
                <h4>Shift &amp; Cash Management</h4>
                <p>Strict drawer tracking, Pay-Ins/Outs, and Z-Reports to ensure complete loss prevention.</p>
                <div className="text-button">
                  <a href="#">Learn More <i className="fa fa-arrow-right"></i></a>
                </div>
              </div>
            </div>
            <div className="col-lg-3">
              <div className="service-item fourth-service">
                <div className="icon"></div>
                <h4>Executive Analytics</h4>
                <p>View true Net Profit, top selling items, and performance trends directly on your dashboard.</p>
                <div className="text-button">
                  <a href="#">Learn More <i className="fa fa-arrow-right"></i></a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div id="about" className="about-us section">
        <div className="container">
          <div className="row">
            <div className="col-lg-6 align-self-center">
              <div className="section-heading">
                <h4>About <em>Nexus SaaS</em> Architecture</h4>
                <img src="assets/images/heading-line-dec.png" alt="" />
                <p>Built securely from the ground up to support massive multi-tenant scale without compromising on performance.</p>
              </div>
              <div className="row">
                <div className="col-lg-6">
                  <div className="box-item">
                    <h4><a href="#">Isolated Data</a></h4>
                    <p>Strict Row-Level Security keeps your business data completely private.</p>
                  </div>
                </div>
                <div className="col-lg-6">
                  <div className="box-item">
                    <h4><a href="#">Role Based Access</a></h4>
                    <p>Restrict cashiers, managers, and owners to specific branches and permissions.</p>
                  </div>
                </div>
                <div className="col-lg-6">
                  <div className="box-item">
                    <h4><a href="#">High Availability</a></h4>
                    <p>Deployed on edge infrastructure for 99.99% uptime.</p>
                  </div>
                </div>
                <div className="col-lg-6">
                  <div className="box-item">
                    <h4><a href="#">Real-time Sync</a></h4>
                    <p>Sales made at Branch A reflect instantly in the main dashboard.</p>
                  </div>
                </div>
                <div className="col-lg-12">
                  <p>Nexus is designed not just as a point of sale, but as a complete operations engine for growing retail chains.</p>
                  <div className="gradient-button">
                    <Link href="/register">Start 14-Day Free Trial</Link>
                  </div>
                  <span>*No Credit Card Required</span>
                </div>
              </div>
            </div>
            <div className="col-lg-6">
              <div className="right-image">
                <div className="about-visual-card">
                  <span className="about-visual-badge">Secure by design</span>
                  <img src="/assets/images/about-right-dec.png" alt="Nexus multi-branch architecture preview" className="custom-illustration" />
                  <div className="about-visual-caption">
                    <strong>Multi-branch ready</strong>
                    Roles, permissions, and data isolation built in
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div id="pricing" className="pricing-tables">
        <div className="container">
          <div className="row">
            <div className="col-lg-8 offset-lg-2">
              <div className="section-heading">
                <h4>Choose The Best <em>Plan</em> For Your Business</h4>
                <img src="assets/images/heading-line-dec.png" alt="" />
                <p>Transparent pricing that scales with your operations. No hidden fees.</p>
              </div>
            </div>
            <div className="col-lg-4">
              <div className="pricing-item-regular">
                <span className="price">5,000 Ksh</span>
                <h4>Starter Retail</h4>
                <div className="icon">
                  <img src="assets/images/pricing-table-01.png" alt="" className="pricing-icon-custom" />
                </div>
                <ul>
                  <li>1 Store Branch</li>
                  <li>Unlimited Products</li>
                  <li>Basic POS Checkouts</li>
                  <li>Shift Management</li>
                  <li>Net Profit Analytics</li>
                  <li>Priority Support</li>
                </ul>
                <div className="border-button">
                  <Link href="/register?plan=starter">Get Started</Link>
                </div>
              </div>
            </div>
            <div className="col-lg-4">
              <div className="pricing-item-pro">
                <span className="price">15,000 Ksh</span>
                <h4>Business Pro</h4>
                <div className="icon">
                  <img src="assets/images/pricing-table-01.png" alt="" className="pricing-icon-custom" />
                </div>
                <ul>
                  <li>Up to 5 Branches</li>
                  <li>Unlimited Products</li>
                  <li>Advanced POS &amp; Inventory</li>
                  <li>Shift &amp; Cash Management</li>
                  <li>Net Profit Analytics</li>
                  <li>Dedicated Account Manager</li>
                </ul>
                <div className="border-button">
                  <Link href="/register?plan=business_pro">Get Started</Link>
                </div>
              </div>
            </div>
            <div className="col-lg-4">
              <div className="pricing-item-regular">
                <span className="price">30,000 Ksh</span>
                <h4>Enterprise</h4>
                <div className="icon">
                  <img src="assets/images/pricing-table-01.png" alt="" className="pricing-icon-custom" />
                </div>
                <ul>
                  <li>Unlimited Branches</li>
                  <li>Unlimited Products</li>
                  <li>Full ERP Suite</li>
                  <li>Advanced Loss Prevention</li>
                  <li>Custom Integrations</li>
                  <li>24/7 Dedicated Support</li>
                </ul>
                <div className="border-button">
                  <Link href="/register?plan=enterprise">Contact Sales</Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div> 

      <footer id="newsletter">
        <div className="container">
          <div className="row">
            <div className="col-lg-8 offset-lg-2">
              <div className="section-heading">
                <h4>Join our mailing list to receive feature updates</h4>
              </div>
            </div>
            <div className="col-lg-6 offset-lg-3">
              <form id="search" action="#" method="GET">
                <div className="row">
                  <div className="col-lg-6 col-sm-6">
                    <fieldset>
                      <input type="email" name="address" className="email" placeholder="Email Address..." required />
                    </fieldset>
                  </div>
                  <div className="col-lg-6 col-sm-6">
                    <fieldset>
                      <button type="submit" className="main-button">Subscribe Now <i className="fa fa-angle-right"></i></button>
                    </fieldset>
                  </div>
                </div>
              </form>
            </div>
          </div>
          <div className="row">
            <div className="col-lg-4">
              <div className="footer-widget">
                <h4>Contact Us</h4>
                <p>Nairobi, Kenya</p>
                <p><a href="tel:+254704003710">+254704003710</a></p>
                <p><a href="mailto:nexussolutions@gmail.com">nexussolutions@gmail.com</a></p>
              </div>
            </div>
            <div className="col-lg-4">
              <div className="footer-widget">
                <h4>Quick Links</h4>
                <ul>
                  <li><a href="#">Home</a></li>
                  <li><a href="#services">Features</a></li>
                  <li><a href="#about">About Architecture</a></li>
                  <li><a href="#pricing">Pricing</a></li>
                </ul>
              </div>
            </div>
            <div className="col-lg-4">
              <div className="footer-widget">
                <h4>About Our Company</h4>
                <div className="logo" style={{ marginBottom: '15px' }}>
                  <h3 style={{ color: 'white' }}>Nexus SaaS</h3>
                </div>
                <p>Building the world's fastest multi-tenant commerce engine for modern retail operations.</p>
              </div>
            </div>
            <div className="col-lg-12">
              <div className="copyright-text">
                <p>Copyright © 2026 Nexus SaaS Corporation. All Rights Reserved. 
                <br />Systems by <a href="https://machariandichu.vercel.app" target="_blank" rel="noopener noreferrer">Nexus Solutions</a></p>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
