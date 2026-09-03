const fs = require('fs');
let code = fs.readFileSync('ios/App/App/LiquidTabBarPlugin.swift', 'utf8');

// 1. Remove the invalid PassThroughHostingController class entirely
const invalidClassRegex = /\/\/ Allows touches to pass through.*?class PassThroughHostingController.*?\}\s*\}/gs;
code = code.replace(invalidClassRegex, '');

// 2. Change PassThroughHostingController instantiation to standard UIHostingController
code = code.replace('let host = PassThroughHostingController(rootView: view)', 'let host = UIHostingController(rootView: view)');

// 3. Change frame to only occupy bottom 150 points to prevent blocking touches on webview
const frameTarget = `                if let webView = self.bridge?.webView, let parent = webView.superview {
                    host.view.frame = parent.bounds
                    host.view.autoresizingMask = [.flexibleWidth, .flexibleHeight]
                    parent.addSubview(host.view)
                    self.hostingController = host
                }`;

const frameReplacement = `                if let webView = self.bridge?.webView, let parent = webView.superview {
                    let bottomHeight: CGFloat = 160
                    host.view.frame = CGRect(x: 0, y: parent.bounds.height - bottomHeight, width: parent.bounds.width, height: bottomHeight)
                    host.view.autoresizingMask = [.flexibleWidth, .flexibleTopMargin]
                    parent.addSubview(host.view)
                    self.hostingController = host
                }`;
code = code.replace(frameTarget, frameReplacement);

// 4. Remove Spacer() from LiquidTabBarView since it's no longer full-screen
code = code.replace('            Spacer()\n', '');

fs.writeFileSync('ios/App/App/LiquidTabBarPlugin.swift', code);
console.log("Patched LiquidTabBarPlugin.swift!");
