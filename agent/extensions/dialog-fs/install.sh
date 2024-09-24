cargo build --release
strip target/release/liblenz_extension_folders.so 
mv target/release/liblenz_extension_folders.so ~/.lenz/extensions/file-dialog/dynlib/liblenz_extension_file_dialog.so