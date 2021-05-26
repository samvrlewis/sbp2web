use wasm_bindgen::prelude::*;
use std::convert::TryInto;
use sbp2csv::runner::{MsgOptions, Runner};
use sbp2csv::options::{Options,MsgOptionsFlags, OutputsFlags};
use sbp::messages::{SBPMessage, SBP};

extern crate console_error_panic_hook;


use serde::{Serialize, Deserialize};

#[derive(Serialize, Deserialize)]
pub struct SbpData {
    pub tow: Vec<f64>,
    pub sog: Vec<f64>,
}


#[wasm_bindgen]
extern "C" {
    fn alert(s: &str);
    // Use `js_namespace` here to bind `console.log(..)` instead of just
    // `log(..)`
    #[wasm_bindgen(js_namespace = console)]
    fn log(s: &str);

    // The `console.log` is quite polymorphic, so we can bind it with multiple
    // signatures. Note that we need to use `js_name` to ensure we always call
    // `log` in JS.
    #[wasm_bindgen(js_namespace = console, js_name = log)]
    fn log_u32(a: u32);

    // Multiple arguments too!
    #[wasm_bindgen(js_namespace = console, js_name = log)]
    fn log_many(a: &str, b: &str);
}

fn log_errors(messages: impl Iterator<Item = sbp::Result<SBP>>) -> impl Iterator<Item = SBP> {
    messages
        .inspect(|msg| {
            if let Err(e) = msg {
                eprintln!("error reading message: {}", e);
            }
        })
        .filter_map(sbp::Result::ok)
}



#[wasm_bindgen]
pub fn handle_sbp_file_data(sbp_file_data: &[u8]) -> JsValue {
    console_error_panic_hook::set_once();
    let file_in_name = std::path::Path::new("/tmp/test");
    let outdir = std::path::Path::new("/tmp/");
    let options = Options {
        msg_options_flags: MsgOptionsFlags {
            use_gnss_only: false,
            use_obs_for_trk: false,
            ignore_gnss_pos: false,
            ignore_ins_pos: false,
        },
        outputs: OutputsFlags {
            csv: true,
            msg_csv: false,
            kml: false,
        },
        sender_ids: None,
        save_metrics: false,
        kr: None,
        out_dir: Some(outdir.to_owned()),
        file_in: Some(file_in_name.to_owned()),
    };
    
    let messages = sbp::iter_messages(sbp_file_data);

    let messages = log_errors(messages);
    let messages = Box::new(messages);
    

    let options = MsgOptions {
        use_gnss_only: false,
        use_obs_for_trk: false,
        ignore_gnss_pos: false,
        ignore_ins_pos: false,
    };

    let mut runner = Runner::new(messages, options);

    let mut i = 0;
    let mut tows = Vec::new();
    let mut sogs = Vec::new();

    for (ds, ds_msg) in &mut runner {
        if let Some(ref ds) = ds {
            match ds.gps_tow_secs {
                None => {},
                Some(week_num) => {
                    tows.push(week_num);
                }
            }
            match ds.sog_mps {
                None => {},
                Some(sog) => {
                    sogs.push(sog);
                }
            }
            i += 1;
            
        }
        if let Some(ref ds_msg) = ds_msg {
           // log("got ds_msg");
        }
    }

    log("Running sbp2csv");
    //run_sbp2csv(options);
    //return zero_vec
    let example = SbpData {
        tow: tows,
        sog: sogs,
    };

    JsValue::from_serde(&example).unwrap()
}
