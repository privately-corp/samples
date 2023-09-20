//
//  VideoAgeEstimationView.swift
//  FaceAssureIos
//
//  Created by Mathieu Monney on 18/09/2023.
//

import SwiftUI
import PrivatelyCoreIos
import AgeEstimationImage

func initSdk() {
    let apiKey = "" // Your API key
    let apiSecret = "" // Your API secret
    if !PrivatelyCore.sharedInstance().isAuthenticated() {
        PrivatelyCore.sharedInstance().authenticate(apiKey: apiKey, apiSecret: apiSecret, callback: { result in
          print("Authentication result: \(result)")
        })

    } else {
        print("Authenticated")
    }
}

struct VideoAgeEstimation: View {
    var view: some View {
        initSdk()
        
        let recorderView = VideoRecorderView(estimationMode: .advanced)

        AgeEstimationImageMain.sharedInstance().addCallback(callback: { ageEstimationResult in
            print("Estimated age range: \(ageEstimationResult.getAgeRange())")
        })

        return recorderView
    }

    var body: some View {
        if PrivatelyCore.sharedInstance().isAuthenticated() {
          view
        }
    }
}
