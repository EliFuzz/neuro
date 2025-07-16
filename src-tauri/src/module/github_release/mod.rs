use serde::Deserialize;
use std::{
    fs::{self, File},
    io::{self, Cursor},
    path::{Path, PathBuf},
};

#[derive(Debug, Deserialize)]
pub struct ReleaseAsset {
    pub name: String,
    pub browser_download_url: String,
}

pub enum ArchiveType {
    Zip,
    TarGz,
    TarBz2,
    TarXz,
    Other,
}

impl From<&str> for ArchiveType {
    fn from(file_name: &str) -> Self {
        if file_name.ends_with(".zip") {
            ArchiveType::Zip
        } else if file_name.ends_with(".tar.gz") || file_name.ends_with(".tgz") {
            ArchiveType::TarGz
        } else if file_name.ends_with(".tar.bz2") || file_name.ends_with(".tbz") {
            ArchiveType::TarBz2
        } else if file_name.ends_with(".tar.xz") || file_name.ends_with(".txz") {
            ArchiveType::TarXz
        } else {
            ArchiveType::Other
        }
    }
}

pub async fn download_github_release(
    owner: String,
    repo: String,
    target_os: String,
    download_dir: String,
) -> Result<PathBuf, String> {
    match download_latest_release(&owner, &repo, &target_os, &PathBuf::from(download_dir)).await {
        Ok(path) => Ok(path),
        Err(e) => Err(e.to_string()),
    }
}

async fn download_latest_release(
    owner: &str,
    repo: &str,
    target_os: &str,
    download_dir: &Path,
) -> Result<PathBuf, Box<dyn std::error::Error>> {
    let assets = fetch_latest_release_assets(owner, repo).await?;

    let asset = assets
        .into_iter()
        .find(|a| a.name.contains(target_os))
        .ok_or(format!("No asset found for OS: {}", target_os))?;

    let download_path = download_dir.join(&asset.name);

    println!(
        "Downloading {} to {:?}",
        asset.browser_download_url, download_path
    );
    download_file(&asset.browser_download_url, &download_path).await?;
    println!("Download complete.");

    let archive_type: ArchiveType = asset.name.as_str().into();

    if let ArchiveType::Other = archive_type {
        println!("Asset is not an archive. Returning downloaded file path.");
        return Ok(download_path);
    }

    let extract_to = download_dir.join(format!("{}-extracted", asset.name));
    println!("Decompressing archive to {:?}", extract_to);
    decompress_archive(&download_path, &extract_to, archive_type)?;
    println!("Decompression complete.");
    Ok(extract_to)
}

async fn fetch_latest_release_assets(
    owner: &str,
    repo: &str,
) -> Result<Vec<ReleaseAsset>, Box<dyn std::error::Error>> {
    let url = format!(
        "https://api.github.com/repos/{}/{}/releases/latest",
        owner, repo
    );
    let client = reqwest::Client::new();
    let response: serde_json::Value = client
        .get(&url)
        .header(reqwest::header::USER_AGENT, "tauri-app")
        .send()
        .await?
        .json()
        .await?;

    let assets_value = response["assets"].as_array().ok_or("No assets found")?;
    let assets: Vec<ReleaseAsset> =
        serde_json::from_value(serde_json::Value::Array(assets_value.to_vec()))?;

    Ok(assets)
}

async fn download_file(url: &str, file_path: &Path) -> Result<(), Box<dyn std::error::Error>> {
    let response = reqwest::get(url).await?.bytes().await?;
    let mut file = File::create(file_path)?;
    io::copy(&mut Cursor::new(response), &mut file)?;
    Ok(())
}

fn decompress_archive(
    archive_path: &Path,
    extract_to: &Path,
    archive_type: ArchiveType,
) -> Result<(), Box<dyn std::error::Error>> {
    match archive_type {
        ArchiveType::Zip => decompress_zip(archive_path, extract_to)?,
        ArchiveType::TarGz => decompress_tar_gz(archive_path, extract_to)?,
        ArchiveType::TarBz2 => decompress_tar_bz2(archive_path, extract_to)?,
        ArchiveType::TarXz => decompress_tar_xz(archive_path, extract_to)?,
        ArchiveType::Other => return Err("Unsupported archive type".into()),
    }
    Ok(())
}

fn decompress_zip(
    archive_path: &Path,
    extract_to: &Path,
) -> Result<(), Box<dyn std::error::Error>> {
    let file = File::open(archive_path)?;
    let mut archive = zip::ZipArchive::new(file)?;

    for i in 0..archive.len() {
        let mut file = archive.by_index(i)?;
        let output_path = match file.enclosed_name() {
            Some(path) => extract_to.join(path),
            None => continue,
        };

        if file.name().ends_with('/') {
            fs::create_dir_all(&output_path)?;
        } else {
            if let Some(p) = output_path.parent() {
                if !p.exists() {
                    fs::create_dir_all(p)?;
                }
            }
            let mut outfile = File::create(&output_path)?;
            io::copy(&mut file, &mut outfile)?;
        }
    }
    Ok(())
}

fn decompress_tar_gz(
    archive_path: &Path,
    extract_to: &Path,
) -> Result<(), Box<dyn std::error::Error>> {
    let file = File::open(archive_path)?;
    let decoder = flate2::read::GzDecoder::new(file);
    let mut archive = tar::Archive::new(decoder);
    archive.unpack(extract_to)?;
    Ok(())
}

fn decompress_tar_bz2(
    archive_path: &Path,
    extract_to: &Path,
) -> Result<(), Box<dyn std::error::Error>> {
    let file = File::open(archive_path)?;
    let decoder = bzip2::read::BzDecoder::new(file);
    let mut archive = tar::Archive::new(decoder);
    archive.unpack(extract_to)?;
    Ok(())
}

fn decompress_tar_xz(
    archive_path: &Path,
    extract_to: &Path,
) -> Result<(), Box<dyn std::error::Error>> {
    let file = File::open(archive_path)?;
    let decoder = liblzma::read::XzDecoder::new(file);
    let mut archive = tar::Archive::new(decoder);
    archive.unpack(extract_to)?;
    Ok(())
}
