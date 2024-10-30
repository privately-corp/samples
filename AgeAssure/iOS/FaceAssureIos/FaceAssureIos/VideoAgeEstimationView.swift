//
//  VideoAgeEstimationView.swift
//  FaceAssureIos
//
//  Created by Mathieu Monney on 18/09/2023.
//

import SwiftUI
import PrivatelyCoreIos
import AgeEstimationImage


struct VideoAgeEstimation: View {
    @StateObject private var viewModel = ViewModel()
    
    var view: some View {
        let recorderView = VideoRecorderView()

        AgeEstimationImageMain.sharedInstance().addCallback(callback: { ageEstimationResult in
            print("Estimated age range: \(ageEstimationResult.getAgeRange())")
        })

        return recorderView
    }

    var body: some View {
        if viewModel.isAuthenticated {
            view
        } else {
            ProgressView().onAppear(perform: {
                self.initSdk()
            })
        }
    }

    func initSdk() {
        if !viewModel.isAuthenticated {
            viewModel.authenticateSdk()
        } else {
            print("Authenticated")
        }
    }
}

extension VideoAgeEstimation {
    class ViewModel: ObservableObject {
        let apiKey = "" // Your API key
        let apiSecret = "" // Your API secret
        
        @Published var isAuthenticated = false
        
        func authenticateSdk() {
            PrivatelyCore.sharedInstance().authenticate(apiKey: apiKey, apiSecret: apiSecret, callback: { result in
                print("Authentication result: \(result)")
                DispatchQueue.main.async{
                    self.isAuthenticated = true
                }
            })
        }
    }
}
