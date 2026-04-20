import { Link } from 'react-router-dom';

const footerLinks = {
  product: [
    { label: 'Features', href: '#features' },
    { label: 'How it Works', href: '#how-it-works' },
    { label: 'Pricing', href: '#pricing' },
    { label: 'API Docs', href: '/docs' },
  ],
  company: [
    { label: 'About', href: '#about' },
    { label: 'Blog', href: '#blog' },
    { label: 'Careers', href: '#careers' },
    { label: 'Contact', href: '#contact' },
  ],
  legal: [
    { label: 'Privacy', href: '#privacy' },
    { label: 'Terms', href: '#terms' },
    { label: 'Security', href: '#security' },
  ],
};

const socialLinks = [
  {
    label: 'GitHub',
    href: '#github',
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.578.688.48C19.138 20.194 22 16.418 22 12.017A9.564 9.564 0 0012 2z" clipRule="evenodd" />
      </svg>
    ),
  },
  {
    label: 'Twitter',
    href: '#twitter',
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
  },
  {
    label: 'Discord',
    href: '#discord',
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1 .8447-1.9888 1.4493-3.0162 2.0543.0624.1227.1242.2547.1372.2538-.0291.1253-.0615.2503-.097.3717-.2934.9764-.4976 1.9665-.5077 2.0561-.0106.1043-.1253.2146-.2044.2885-.1491.1517-.2995.2923-.4472.4659-.0769.1273-.153 2.5363e-4 -.2301.0254-.0715.0696-.1443.1391-.2179.2301-.0057.0107-.0107.0214-.0161.0324-.0459.1365-.0843.2697-.1268.4025-.0291.0938-.0486.1888-.0693.2829-.0194.0578-.0194.1162-.0013.1738.0952.3995 1.2959 1.733 2.8289 2.1641-.012.0037-.0161.0071-.02.0106-.0579.1514-.113.2995-.1739.4472-.0722.1766-.1426.3548-.2136.5358-.0419.107-.0802.2163-.1155.3269-.0057.0098-.0093.0198-.0131.0299-.0052.0139-.009.0288-.0115.0426-.0014.0037-.0014.0075 0 .0112.0889 1.1869 1.7397 2.1436 3.1766 2.2456.0842.0066.1646.0112.2457.0131 1.275-.1514 2.4538-.6139 3.4751-1.3714.3489-.2622.6312-.5858.8365-.9583a10.981 10.981 0 001.2494-1.3634c.061-.1273.1192-.2555.1766-.3833-.0478-.0937-.0919-.188-.1325-.2825.0056-.0113.0112-.0226.0168-.0339.0868-.1766.1628-.3579.2264-.541.0264-.0769.0509-.1546.0732-.2334.0217-.0766.0418-.1542.0603-.2324h-.0116zM15.7158 17.4068c-.1382-.0492-.2883-.0739-.4412-.0766.1273-.0913.2406-.1972.3355-.2957.4322-.6774.9248-1.1933 1.4026-.2693-.2497-.5436-.4914-.8182-.7145-.0922-.0752-.1877-.1429-.2861-.2025-.0987-.0597-.2025-.1109-.3119-.1537-.1109-.0434-.2267-.0775-.3494-.1023-.1269-.0255-.2577-.0381-.3922-.0378-.1344.0003-.2632.0134-.3893.0393-.1243.0255-.2443.0575-.3566.0965-.1107.0385-.2147.0866-.3088.1441-.0898.0552-.1734.1193-.2473.1921-.0675.0663-.1283.1395-.1818.2186-.053.0795-.1001.1632-.1409.2501-.0408.0872-.0755.1788-.104.2742-.0281.095-.0487.1931-.0618.2936-.0129.1001-.0185.2032-.0168.3072.0016.1014.0086.2014.0209.2997.0127.1012.0315.1991.0562.2939.025.0956.0576.1867.0976.2727.0409.0876.0902.1702.1477.2475.0582.0784.1255.1485.1999.2089.0773.0625.1609.1142.2497.1532.0915.0403.1887.0689.2902.0852.1052.0169.2144.0255.3275.0259h.0084c.113.0005.2194-.0093.3155-.0292.0933-.0193.1801-.0503.256-.0918.0741-.0406.1411-.0905.1987-.1485.0568-.0573.1066-.1218.1478-.1919.0406-.0696.0746-.1444.1013-.2236.0273-.081.0505-.1663.0693-.2548.0193-.0908.0345-.1847.0456-.2812.0109-.0943.0182-.1908.0218-.2893.0035-.0972.0035-.1954 0-.2927-.0038-.1009-.0132-.1998-.0282-.2959-.0153-.0981-.0391-.1923-.0709-.2818-.0324-.0912-.0737-.1765-.1228-.2544-.0502-.0796-.1089-.1518-.1741-.2153-.0634-.0618-.1337-.1154-.2087-.1598-.0736-.0436-.1525-.079-.2347-.1055-.0809-.0261-.1653-.0424-.2521-.0487-.0852-.0062-.1727-.0062-.2587 0-.0854.0061-.1682.0182-.2468.0361-.0776.0177-.1518.0411-.2216.0699-.0691.0287-.1351.0623-.1966.1009-.061.0385-.1191.0811-.1735.1276-.0545.0468-.1056.0976-.1526.1524-.0479.0555-.0924.1145-.1334.1768-.0414.063-.0793.1294-.1137.1989-.0346.0699-.0657.1424-.0933.2173-.0274.0746-.0506.1515-.0696.2301-.0189.0784-.0342.1589-.0458.2411-.0117.0832-.0199.1682-.0246.2546-.0047.0873-.0058.1753-.0033.2635.0025.0875.0086.1738.0182.2582.0095.0837.0228.1652.0398.244.0176.0814.0418.1588.0723.2325.0315.0761.0711.1463.1179.2098.0476.0649.1024.124 1639.1430.1861.0411.0613.0884.1171.1402.0287.0518.0636.0983.1043.1394.0405.0409.0866.0773.1376.1087.0509.0313.1062.0576.1651.0783.0589.0207.1217.0363.1875.0467.0659.0105.135.0163.2068.0175.0734.0013.1486-.0013.225-.0077.0765-.0064.15-.0183.2204-.0358.0698-.0175.1366-.0412.2003-.071.0638-.0299.1249-.0652.1827-.106.0577-.0408.1129-.0864.165-.1369.0521-.0505.1016-.1052.1482-.1639.0466-.0587.0907-.1213.132-.1877.0412-.0664.0801-.1358.1166-.2076.0365-.0719.0707-.1464.1026-.2235.0322-.0781.0622-.1586.0903-.2417l.0016-.0047z" />
      </svg>
    ),
  },
];

export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main footer content */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 py-12">
          {/* Brand column */}
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="inline-flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <span className="text-xl font-bold text-gray-900">MediaHub</span>
            </Link>
            <p className="mt-4 text-sm text-gray-500 leading-relaxed">
              Modern media management platform for developers and content creators.
            </p>
            {/* Social links */}
            <div className="flex items-center gap-4 mt-6">
              {socialLinks.map((link, index) => (
                <a
                  key={index}
                  href={link.href}
                  className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-900 hover:text-white transition-all"
                  aria-label={link.label}
                >
                  {link.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Product links */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">
              Product
            </h3>
            <ul className="space-y-3">
              {footerLinks.product.map((link, index) => (
                <li key={index}>
                  <a href={link.href} className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Company links */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">
              Company
            </h3>
            <ul className="space-y-3">
              {footerLinks.company.map((link, index) => (
                <li key={index}>
                  <a href={link.href} className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal links */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">
              Legal
            </h3>
            <ul className="space-y-3">
              {footerLinks.legal.map((link, index) => (
                <li key={index}>
                  <a href={link.href} className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-gray-200 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-gray-500">
              &copy; {new Date().getFullYear()} MediaHub. All rights reserved.
            </p>
            <p className="text-sm text-gray-500">
              Built with modern web technologies
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}