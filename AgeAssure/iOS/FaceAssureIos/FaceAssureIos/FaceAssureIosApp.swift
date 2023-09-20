//
//  FaceAssureIosApp.swift
//  FaceAssureIos
//
//  Created by Mathieu Monney on 18/09/2023.
//

import SwiftUI
import PrivatelyCoreIos

@main
struct FaceAssureIosApp: App {
    let apiKey = "" // Your API key
    let apiSecret = "" // Your API secret
    var body: some Scene {
        WindowGroup {
            VideoAgeEstimation().onAppear(perform: {
                if !PrivatelyCore.sharedInstance().isAuthenticated() {
                    PrivatelyCore.sharedInstance().authenticate(apiKey: apiKey, apiSecret: apiSecret, callback: { result in
                        print("Authentication result: \(result)")
                    })
                } else {
                    print("logged")
                }
            })
        }
    }
}
