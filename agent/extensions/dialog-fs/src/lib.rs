use lenz_core::{
    define_invoke_handlers,
    extensions::plugin::{LenzPlugin, LenzPluginContext},
    invoke::{InvokeRequest, InvokeResult},
};
use traverse::{ListAllOptions, Sort};

mod entry;
mod folders;
mod traverse;

struct FoldersPlugin;

impl LenzPlugin for FoldersPlugin {
    fn activate(&mut self, context: &mut LenzPluginContext) {
        context.invoke_handlers.extend(
            define_invoke_handlers!(
                "folders.locals" => |_| async {
                    let entries = folders::get_locals();

                    InvokeResult::Json(serde_json::to_value(entries).unwrap())
                },
                "folders.disks" => |_| async {
                    let entries = folders::get_disk_partitions();

                    InvokeResult::Json(serde_json::to_value(entries).unwrap())
                },
                "folders.list" => |invoke: InvokeRequest| async move {
                    let dir = if let Some(dir) = invoke.args.get_text("dir") {
                        dir.to_string()
                    } else {
                        return InvokeResult::Error("Missing `dir` parameter".to_string());
                    };

                    let show_hidden = invoke.args.get_as::<bool>("show_hidden").unwrap_or_default();
                    let query = invoke.args.get_text("query").unwrap_or_default().to_string();
                    let filter = invoke.args.get_all_text("filter").unwrap_or_default().into_iter().map(|f| f.to_string()).collect::<Vec<_>>();
                    let sort_by: Vec<Sort> = invoke.args.get_all_text("sort_by").and_then(|text| text.iter().map(|s| serde_json::from_str::<Sort>(s).ok()).collect()).unwrap_or_default();
                    let only_folders = invoke.args.get_as::<bool>("only_folders").unwrap_or_default();

                    let options = ListAllOptions {
                        show_hidden,
                        query,
                        filter,
                        sort_by,
                        only_folders
                    };

                    let entries = traverse::list(dir, options);

                    return InvokeResult::Json(serde_json::to_value(entries).unwrap());
                }
            )
        )
    }

    fn destroy(&self, _: &mut LenzPluginContext) {}
}

#[no_mangle]
pub fn create_plugin(_: &mut LenzPluginContext) -> Box<dyn LenzPlugin> {
    println!("Creating folders-plugin plugin");
    Box::new(FoldersPlugin)
}
