mod handlers;
use std::sync::Arc;

use handlers as fs;

use lenz_core::{extensions::plugin::{LenzPlugin, LenzPluginContext}, invoke::{InvokeRequest, InvokeResult}};

pub struct FsLenzExtension;

impl LenzPlugin for FsLenzExtension {
    fn activate(&mut self, context: &mut LenzPluginContext) {
        println!("Activating fs plugin");
        context
            .invoke_handlers
            .extend(lenz_core::define_invoke_handlers! {
                "fs.readFile" => fs::read,
                "fs.writeFile" => fs::write
            })

    }

    fn destroy(&self, _: &mut LenzPluginContext) {
        println!("Destroying fs plugin");
    }
}

#[no_mangle]
pub fn create_plugin(_: &mut LenzPluginContext) -> Box<dyn LenzPlugin> {
    println!("Creating fs plugin");
    Box::new(FsLenzExtension)
}