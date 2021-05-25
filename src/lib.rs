use wasm_bindgen::prelude::*;
use std::convert::TryInto;
#[wasm_bindgen]
extern "C" {
    fn alert(s: &str);
}

#[wasm_bindgen]
pub fn handle_sbp_file_data(sbp_file_data: &[u8]) -> u32 {    
    return sbp_file_data.len().try_into().unwrap()
}
