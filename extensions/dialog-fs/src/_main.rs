use folders::{get_disk_partitions, get_locals};
use traverse::{ListAllOptions, Sort};

mod entry;
mod folders;
mod traverse;

fn main() {
    let entries = get_locals()
        .into_iter()
        .chain(get_disk_partitions().into_iter())
        .collect::<Vec<_>>();

    println!("{:#?}", entries);

    let entries = traverse::list(
        "/home/sallon/Área de trabalho/hello.lenz".to_string(),
        ListAllOptions {
            show_hidden: false,
            only_folders: false,
            query: String::default(),
            filter: vec![
                "*.html".to_string()
            ],
            sort_by: vec![
                Sort("kind".to_string(), true),
                Sort("name".to_string(), true),
            ],
        },
    ).into_iter().map(|entry| entry.name).collect::<Vec<_>>();

    println!("{}", serde_json::to_string_pretty(&entries).unwrap());
}
