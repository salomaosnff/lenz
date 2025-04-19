pub fn search_chromium_based_browser() -> Option<&'static str> {
    #[cfg(target_os = "windows")]
    const BROWSER_LIST: [&str; 6] = [
        "brave.exe",
        "chromium.exe",
        "chrome.exe",
        "microsoftedge.exe",
        "opera.exe",
        "vivaldi.exe",
    ];

    #[cfg(not(target_os = "windows"))]
    const BROWSER_LIST: [&str; 6] = [
        "brave",
        "chromium",
        "google-chrome",
        "microsoft-edge",
        "opera",
        "vivaldi",
    ];

    for browser in BROWSER_LIST.iter() {
        if which::which(browser).is_ok() {
            return Some(browser);
        }
    }

    None
}

pub fn open(url: &str) -> tokio::process::Child {
    #[cfg(target_os = "windows")]
    {
        tokio::process::Command::new("cmd")
            .args(&["/C", "start", url])
            .spawn()
            .expect("Failed to open browser")
    }

    #[cfg(target_os = "linux")]
    {
        tokio::process::Command::new("xdg-open")
            .arg(url)
            .spawn()
            .expect("Failed to open browser")
    }

    #[cfg(target_os = "macos")]
    {
        tokio::process::Command::new("open")
            .arg(url)
            .spawn()
            .expect("Failed to open browser")
    }
}

pub fn open_in_app_mode(url: &str) -> tokio::process::Child {
    if let Some(browser) = search_chromium_based_browser() {
        println!("Opening {} in app mode", browser);
        tokio::process::Command::new(browser)
            .arg(format!("--app={}", url))
            .spawn()
            .expect("Failed to open browser in app mode")
    } else {
        println!("Chromium-based browser not found, opening in default mode...");
        open(url)
    }
}
