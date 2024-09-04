use super::form::Form;

#[derive(Debug)]
pub struct InvokeRequest {
    pub command: String,
    pub args: Form,
}